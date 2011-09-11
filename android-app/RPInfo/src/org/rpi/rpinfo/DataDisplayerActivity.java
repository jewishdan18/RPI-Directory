package org.rpi.rpinfo;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

import android.app.ListActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

public class DataDisplayerActivity extends ListActivity {
	
	/** 
	 * @param in An input stream.
	 * @return String containing everything that was in the input stream.
	 */
	private String readInputStream(InputStream in){
		try {
			String result = "";
			byte[] buffer = new byte[1024];
			
			//Loop until there is nothing left in the stream
			while( in.available() > 0 ){
				//Only write to the string the number of bytes read
				int num_read = in.read(buffer, 0, buffer.length);
				result = result + new String(buffer, 0, num_read);
			}
			
			return result;
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		return null;
	}

	public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        ArrayList<String> list_items = new ArrayList<String>();
        list_items.add("one");
        list_items.add("two");
        list_items.add("three");
        setListAdapter(new ArrayAdapter<String>(this, R.layout.query_result_list_item, list_items));
        list_items.add("four");
              
        ListView lv = getListView();
        lv.setOnItemClickListener(new OnItemClickListener(){
			public void onItemClick(AdapterView<?> parent, View view, int position,
					long id) {
				Toast.makeText(getApplicationContext(), ((TextView) view).getText(), Toast.LENGTH_SHORT).show();
			}
        });
                
        /*
		Bundle b = getIntent().getExtras();
		if( b == null ){
			finish();
		}
		
		String searchTerm = (String)b.get("searchTerm");
		
		try {
			URL apiURL = new URL("rpidirectory.appspot.com/api?name=" + searchTerm);
			URLConnection connection = apiURL.openConnection();
			InputStream in = new BufferedInputStream(connection.getInputStream());
		} catch (MalformedURLException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		*/
		
	}
}